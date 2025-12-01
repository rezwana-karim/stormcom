"use client";

import { SUGGESTED_ROLE_TEMPLATES, type SuggestedRoleTemplate } from "@/lib/custom-role-permissions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface RoleTemplateSelectorProps {
  onSelect: (name: string, permissions: string[]) => void;
  disabled?: boolean;
}

export function RoleTemplateSelector({ onSelect, disabled }: RoleTemplateSelectorProps) {
  const templates = Object.entries(SUGGESTED_ROLE_TEMPLATES) as [SuggestedRoleTemplate, string[]][];
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-medium">Quick Start Templates</h4>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map(([name, permissions]) => (
          <Card 
            key={name} 
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => !disabled && onSelect(name, permissions)}
          >
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">{name}</CardTitle>
              <CardDescription className="text-xs">
                <Badge variant="secondary" className="text-xs">
                  {permissions.length} permissions
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="flex flex-wrap gap-1">
                {permissions.slice(0, 4).map((perm) => (
                  <Badge key={perm} variant="outline" className="text-xs">
                    {perm.split(':')[0]}
                  </Badge>
                ))}
                {permissions.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{permissions.length - 4}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
