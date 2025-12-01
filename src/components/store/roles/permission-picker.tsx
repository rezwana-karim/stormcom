"use client";

import { useState } from "react";
import { AVAILABLE_PERMISSIONS, getAllPermissionKeys } from "@/lib/custom-role-permissions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

interface PermissionPickerProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}

export function PermissionPicker({
  selectedPermissions,
  onChange,
  disabled = false,
}: PermissionPickerProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    AVAILABLE_PERMISSIONS.map(c => c.category)
  );
  
  const allPermissionKeys = getAllPermissionKeys();
  const selectedCount = selectedPermissions.length;
  const totalCount = allPermissionKeys.length;
  
  const togglePermission = (key: string) => {
    if (disabled) return;
    
    if (selectedPermissions.includes(key)) {
      onChange(selectedPermissions.filter(p => p !== key));
    } else {
      onChange([...selectedPermissions, key]);
    }
  };
  
  const toggleCategory = (category: string) => {
    if (disabled) return;
    
    const categoryPerms = AVAILABLE_PERMISSIONS
      .find(c => c.category === category)
      ?.permissions.map(p => p.key) || [];
    
    const allSelected = categoryPerms.every(p => selectedPermissions.includes(p));
    
    if (allSelected) {
      // Remove all from this category
      onChange(selectedPermissions.filter(p => !categoryPerms.includes(p)));
    } else {
      // Add all from this category
      const newPerms = new Set([...selectedPermissions, ...categoryPerms]);
      onChange(Array.from(newPerms));
    }
  };
  
  const selectAll = () => {
    if (!disabled) {
      onChange(allPermissionKeys);
    }
  };
  
  const clearAll = () => {
    if (!disabled) {
      onChange([]);
    }
  };
  
  const getCategoryStats = (category: string) => {
    const categoryPerms = AVAILABLE_PERMISSIONS
      .find(c => c.category === category)
      ?.permissions.map(p => p.key) || [];
    
    const selected = categoryPerms.filter(p => selectedPermissions.includes(p)).length;
    return { selected, total: categoryPerms.length };
  };
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <Badge variant="secondary" className="mr-2">
            {selectedCount} / {totalCount}
          </Badge>
          permissions selected
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={selectAll}
            disabled={disabled || selectedCount === totalCount}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAll}
            disabled={disabled || selectedCount === 0}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      </div>
      
      {/* Permission Categories */}
      <Accordion 
        type="multiple" 
        value={expandedCategories}
        onValueChange={setExpandedCategories}
        className="space-y-2"
      >
        {AVAILABLE_PERMISSIONS.map((category) => {
          const stats = getCategoryStats(category.category);
          const allSelected = stats.selected === stats.total;
          const someSelected = stats.selected > 0 && stats.selected < stats.total;
          
          return (
            <AccordionItem
              key={category.category}
              value={category.category}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) {
                        (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected;
                      }
                    }}
                    onCheckedChange={() => toggleCategory(category.category)}
                    disabled={disabled}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{category.category}</span>
                    <span className="text-xs text-muted-foreground">
                      {category.description}
                    </span>
                  </div>
                  <Badge 
                    variant={allSelected ? "default" : someSelected ? "secondary" : "outline"}
                    className="ml-auto mr-2"
                  >
                    {stats.selected}/{stats.total}
                  </Badge>
                </div>
              </AccordionTrigger>
              
              <AccordionContent>
                <div className="grid gap-3 py-2 pl-8">
                  {category.permissions.map((permission) => {
                    const isSelected = selectedPermissions.includes(permission.key);
                    
                    return (
                      <div
                        key={permission.key}
                        className={cn(
                          "flex items-start gap-3 p-2 rounded-md transition-colors",
                          isSelected ? "bg-primary/5" : "hover:bg-muted/50",
                          disabled && "opacity-50"
                        )}
                      >
                        <Checkbox
                          id={permission.key}
                          checked={isSelected}
                          onCheckedChange={() => togglePermission(permission.key)}
                          disabled={disabled}
                        />
                        <div className="grid gap-0.5 leading-none">
                          <Label
                            htmlFor={permission.key}
                            className={cn(
                              "text-sm font-medium cursor-pointer",
                              disabled && "cursor-not-allowed"
                            )}
                          >
                            {permission.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                          <code className="text-xs text-muted-foreground/70 font-mono">
                            {permission.key}
                          </code>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
