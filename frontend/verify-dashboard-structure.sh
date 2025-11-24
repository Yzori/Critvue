#!/bin/bash

# Dashboard Structure Verification Script
# Verifies the reorganization was successful

echo "🔍 Verifying Dashboard Reorganization..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check shared folder structure
echo "📁 Checking Shared Components..."
if [ -d "components/dashboard/shared" ]; then
    echo -e "${GREEN}✓${NC} Shared folder exists"
    
    # Check shared files
    files=(
        "urgency-indicator.tsx"
        "review-status-badge.tsx"
        "empty-state.tsx"
        "loading-skeleton.tsx"
        "auto-accept-timer.tsx"
        "index.ts"
    )
    
    for file in "${files[@]}"; do
        if [ -f "components/dashboard/shared/$file" ]; then
            echo -e "  ${GREEN}✓${NC} $file"
        else
            echo -e "  ${RED}✗${NC} $file MISSING"
        fi
    done
    
    # Check stats subfolder
    if [ -d "components/dashboard/shared/stats" ]; then
        echo -e "${GREEN}✓${NC} Stats subfolder exists"
        stats_files=("stat-card.tsx" "mini-stat.tsx" "trend-indicator.tsx" "index.ts")
        for file in "${stats_files[@]}"; do
            if [ -f "components/dashboard/shared/stats/$file" ]; then
                echo -e "  ${GREEN}✓${NC} stats/$file"
            else
                echo -e "  ${RED}✗${NC} stats/$file MISSING"
            fi
        done
    else
        echo -e "${RED}✗${NC} Stats subfolder missing"
    fi
else
    echo -e "${RED}✗${NC} Shared folder missing"
fi

echo ""

# Check mobile folder structure
echo "📱 Checking Mobile Components..."
if [ -d "components/dashboard/mobile" ]; then
    echo -e "${GREEN}✓${NC} Mobile folder exists"
    
    mobile_files=(
        "mobile-creator-dashboard.tsx"
        "mobile-reviewer-dashboard.tsx"
        "swipeable-review-card.tsx"
        "dashboard-bottom-nav.tsx"
        "pull-to-refresh.tsx"
        "urgency-countdown.tsx"
        "batch-accept-button.tsx"
        "index.ts"
    )
    
    for file in "${mobile_files[@]}"; do
        if [ -f "components/dashboard/mobile/$file" ]; then
            echo -e "  ${GREEN}✓${NC} $file"
        else
            echo -e "  ${RED}✗${NC} $file MISSING"
        fi
    done
else
    echo -e "${RED}✗${NC} Mobile folder missing"
fi

echo ""

# Check desktop folder structure
echo "🖥️  Checking Desktop Structure..."
if [ -d "components/dashboard/desktop" ]; then
    echo -e "${GREEN}✓${NC} Desktop folder exists"
    
    desktop_folders=("panels" "navigation" "data-table" "filters")
    for folder in "${desktop_folders[@]}"; do
        if [ -d "components/dashboard/desktop/$folder" ]; then
            echo -e "  ${GREEN}✓${NC} $folder/ subfolder exists"
            if [ -f "components/dashboard/desktop/$folder/index.ts" ]; then
                echo -e "    ${GREEN}✓${NC} $folder/index.ts"
            else
                echo -e "    ${RED}✗${NC} $folder/index.ts MISSING"
            fi
        else
            echo -e "  ${RED}✗${NC} $folder/ subfolder missing"
        fi
    done
    
    if [ -f "components/dashboard/desktop/README.md" ]; then
        echo -e "  ${GREEN}✓${NC} README.md"
    else
        echo -e "  ${RED}✗${NC} README.md MISSING"
    fi
else
    echo -e "${RED}✗${NC} Desktop folder missing"
fi

echo ""

# Check master barrel export
echo "📦 Checking Master Barrel Export..."
if [ -f "components/dashboard/index.ts" ]; then
    echo -e "${GREEN}✓${NC} Master barrel export exists"
else
    echo -e "${RED}✗${NC} Master barrel export missing"
fi

echo ""

# Count files
echo "📊 File Count Summary:"
shared_count=$(find components/dashboard/shared -type f -name "*.tsx" -o -name "*.ts" | wc -l)
mobile_count=$(find components/dashboard/mobile -type f -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)
desktop_count=$(find components/dashboard/desktop -type f -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)

echo "  Shared components: $shared_count"
echo "  Mobile components: $mobile_count"
echo "  Desktop structure files: $desktop_count"

echo ""
echo -e "${GREEN}✅ Verification Complete!${NC}"
