"use client";

import { ProjectView } from "@/components/project/project-view";
import { BoboSidebarOptionA } from "@/components/ui/bobo-sidebar-option-a";
import { useParams } from "next/navigation";

// Mock data - In real app, this would come from database
const mockProjectData = {
  "proj-1": {
    name: "E-Commerce Redesign",
    chats: [
      {
        id: "1",
        title: "Product Page Layout",
        preview: "Let's discuss the new product page layout with image gallery and quick view features...",
        timestamp: new Date("2025-01-20T14:30:00"),
        projectId: "proj-1",
      },
      {
        id: "2",
        title: "Shopping Cart UX",
        preview: "Working on the shopping cart user experience improvements and checkout flow...",
        timestamp: new Date("2025-01-19T10:15:00"),
        projectId: "proj-1",
      },
      {
        id: "3",
        title: "Mobile Navigation",
        preview: "Designing the mobile navigation menu and sidebar for better user engagement...",
        timestamp: new Date("2025-01-18T16:45:00"),
        projectId: "proj-1",
      },
      {
        id: "4",
        title: "Search Functionality",
        preview: "Implementing advanced search with filters, facets, and autocomplete suggestions...",
        timestamp: new Date("2025-01-17T11:20:00"),
        projectId: "proj-1",
      },
      {
        id: "5",
        title: "Payment Integration",
        preview: "Setting up Stripe payment integration with support for multiple currencies...",
        timestamp: new Date("2025-01-16T09:00:00"),
        projectId: "proj-1",
      },
    ],
  },
  "proj-2": {
    name: "ML Research",
    chats: [
      {
        id: "6",
        title: "Model Architecture",
        preview: "Exploring different neural network architectures for our classification task...",
        timestamp: new Date("2025-01-20T15:00:00"),
        projectId: "proj-2",
      },
      {
        id: "7",
        title: "Dataset Preparation",
        preview: "Cleaning and preprocessing the dataset, handling missing values and outliers...",
        timestamp: new Date("2025-01-19T13:30:00"),
        projectId: "proj-2",
      },
      {
        id: "8",
        title: "Hyperparameter Tuning",
        preview: "Running experiments to find optimal hyperparameters for best model performance...",
        timestamp: new Date("2025-01-18T10:00:00"),
        projectId: "proj-2",
      },
    ],
  },
  "proj-3": {
    name: "Portfolio Redesign",
    chats: [
      {
        id: "9",
        title: "Hero Section Design",
        preview: "Creating an engaging hero section with animated elements and clear call-to-action...",
        timestamp: new Date("2025-01-20T12:00:00"),
        projectId: "proj-3",
      },
      {
        id: "10",
        title: "Project Showcase",
        preview: "Designing the project gallery with hover effects and detailed case studies...",
        timestamp: new Date("2025-01-19T14:00:00"),
        projectId: "proj-3",
      },
    ],
  },
  "proj-4": {
    name: "API Documentation",
    chats: [
      {
        id: "11",
        title: "Authentication Endpoints",
        preview: "Documenting OAuth2 flow and JWT token management for API authentication...",
        timestamp: new Date("2025-01-20T11:00:00"),
        projectId: "proj-4",
      },
      {
        id: "12",
        title: "Rate Limiting",
        preview: "Explaining rate limiting policies and best practices for API consumers...",
        timestamp: new Date("2025-01-19T15:30:00"),
        projectId: "proj-4",
      },
      {
        id: "13",
        title: "Error Handling",
        preview: "Creating comprehensive error code documentation with examples...",
        timestamp: new Date("2025-01-18T09:30:00"),
        projectId: "proj-4",
      },
      {
        id: "14",
        title: "Webhook Setup",
        preview: "Writing webhook configuration guide with payload examples and security...",
        timestamp: new Date("2025-01-17T14:00:00"),
        projectId: "proj-4",
      },
    ],
  },
  "proj-5": {
    name: "Mobile App Prototype",
    chats: [
      {
        id: "15",
        title: "Onboarding Flow",
        preview: "Designing user onboarding experience with tutorial slides and permissions...",
        timestamp: new Date("2025-01-20T10:00:00"),
        projectId: "proj-5",
      },
      {
        id: "16",
        title: "Navigation Patterns",
        preview: "Implementing tab bar navigation with deep linking support...",
        timestamp: new Date("2025-01-19T12:00:00"),
        projectId: "proj-5",
      },
      {
        id: "17",
        title: "Push Notifications",
        preview: "Setting up push notification system with Firebase Cloud Messaging...",
        timestamp: new Date("2025-01-18T15:00:00"),
        projectId: "proj-5",
      },
      {
        id: "18",
        title: "Offline Support",
        preview: "Adding offline functionality with local storage and sync mechanisms...",
        timestamp: new Date("2025-01-17T10:30:00"),
        projectId: "proj-5",
      },
      {
        id: "19",
        title: "Dark Mode",
        preview: "Implementing system-aware dark mode with smooth transitions...",
        timestamp: new Date("2025-01-16T13:00:00"),
        projectId: "proj-5",
      },
      {
        id: "20",
        title: "Performance Optimization",
        preview: "Optimizing app performance with lazy loading and code splitting...",
        timestamp: new Date("2025-01-15T11:00:00"),
        projectId: "proj-5",
      },
    ],
  },
};

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  // Get project data from mock
  const projectData = mockProjectData[projectId as keyof typeof mockProjectData];

  // Handle project not found
  if (!projectData) {
    return (
      <BoboSidebarOptionA>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Project not found
            </h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
              The project you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </BoboSidebarOptionA>
    );
  }

  const handleNameChange = (newName: string) => {
    console.log(`Project name changed to: ${newName}`);
    // In real app, this would update the database
  };

  const handleSubmit = (message: any) => {
    console.log("Message submitted:", message);
    // In real app, this would create a new chat in the project
  };

  return (
    <BoboSidebarOptionA>
      <ProjectView
        projectId={projectId}
        projectName={projectData.name}
        chats={projectData.chats}
        onNameChange={handleNameChange}
        onSubmit={handleSubmit}
      />
    </BoboSidebarOptionA>
  );
}
