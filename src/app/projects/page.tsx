import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconPlus, IconFolder, IconClock, IconUsers } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Projects",
  description: "Manage your projects and workspaces",
};

// Mock project data - replace with actual DB queries
const projects = [
  {
    id: "1",
    name: "E-commerce Platform",
    description: "Building a multi-vendor marketplace",
    status: "active",
    members: 5,
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "Mobile App",
    description: "Cross-platform mobile application",
    status: "planning",
    members: 3,
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "3",
    name: "Analytics Dashboard",
    description: "Real-time analytics and reporting",
    status: "active",
    members: 4,
    updatedAt: new Date("2024-01-12"),
  },
];

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Create and manage your projects and workspaces.
          </p>
        </div>
        <Button className="gap-2">
          <IconPlus className="size-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <IconFolder className="size-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Get started by creating your first project.
            </p>
            <Button className="mt-6 gap-2">
              <IconPlus className="size-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="transition-colors hover:bg-accent/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <IconFolder className="size-10 text-primary" />
                  <Badge
                    variant={project.status === "active" ? "default" : "secondary"}
                  >
                    {project.status}
                  </Badge>
                </div>
                <CardTitle className="mt-4">{project.name}</CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <IconUsers className="size-4" />
                    <span>{project.members}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconClock className="size-4" />
                    <span>
                      {project.updatedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
