#!/bin/bash

# SwissBooks Health Monitoring Script
# Run this script periodically to check system health

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if a service is running
check_service() {
    local service_name=$1
    local service_url=$2
    
    if curl -f "$service_url" >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service_name is healthy"
        return 0
    else
        echo -e "${RED}✗${NC} $service_name is not responding"
        return 1
    fi
}

# Check Docker container status
check_container() {
    local container_name=$1
    
    if docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        echo -e "${GREEN}✓${NC} Container $container_name is running"
        return 0
    else
        echo -e "${RED}✗${NC} Container $container_name is not running"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    local threshold=80
    local usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt "$threshold" ]; then
        echo -e "${GREEN}✓${NC} Disk usage: ${usage}% (OK)"
        return 0
    else
        echo -e "${YELLOW}!${NC} Disk usage: ${usage}% (Warning: >${threshold}%)"
        return 1
    fi
}

# Check memory usage
check_memory() {
    local total_mem=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    local used_mem=$(free -m | awk 'NR==2{printf "%.0f", $3}')
    local usage_percent=$((used_mem * 100 / total_mem))
    
    if [ "$usage_percent" -lt 80 ]; then
        echo -e "${GREEN}✓${NC} Memory usage: ${usage_percent}% (OK)"
        return 0
    else
        echo -e "${YELLOW}!${NC} Memory usage: ${usage_percent}% (Warning: >80%)"
        return 1
    fi
}

# Check database file
check_database() {
    local db_file="./data/accounting.db"
    
    if [ -f "$db_file" ]; then
        local size=$(du -h "$db_file" | cut -f1)
        echo -e "${GREEN}✓${NC} Database file exists (${size})"
        return 0
    else
        echo -e "${YELLOW}!${NC} Database file not found at $db_file"
        return 1
    fi
}

# Check backup status
check_backups() {
    local backup_dir="./backups"
    
    if [ -d "$backup_dir" ]; then
        local backup_count=$(find "$backup_dir" -name "*.db" -mtime -1 | wc -l)
        if [ "$backup_count" -gt 0 ]; then
            echo -e "${GREEN}✓${NC} Recent backup found (${backup_count} in last 24h)"
            return 0
        else
            echo -e "${YELLOW}!${NC} No backups in last 24h"
            return 1
        fi
    else
        echo -e "${YELLOW}!${NC} Backup directory not found"
        return 1
    fi
}

# Main health check
main() {
    echo "======================================"
    echo "SwissBooks Health Check"
    echo "======================================"
    echo "Time: $(date)"
    echo ""
    
    local exit_code=0
    
    # Container checks
    echo "Docker Containers:"
    check_container "accounting-frontend" || exit_code=1
    check_container "accounting-backend" || exit_code=1
    echo ""
    
    # Service checks
    echo "Services:"
    check_service "Frontend" "http://localhost" || exit_code=1
    check_service "Backend API" "http://localhost:8000/health" || exit_code=1
    echo ""
    
    # System checks
    echo "System Resources:"
    check_disk_space || exit_code=1
    check_memory || exit_code=1
    echo ""
    
    # Data checks
    echo "Data Integrity:"
    check_database || exit_code=1
    check_backups || exit_code=1
    echo ""
    
    # Summary
    echo "======================================"
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}All checks passed!${NC}"
    else
        echo -e "${YELLOW}Some checks failed. Please review above.${NC}"
    fi
    echo "======================================"
    
    return $exit_code
}

# Run main function
main "$@"
