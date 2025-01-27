"use client";

import { Button } from "@/components/ui/button";
import { Brush, Users, Zap } from "lucide-react";
import Link from "next/link";

function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Brush className="h-6 w-6" />
            <span className="text-xl font-bold">Draw App</span>
          </div>
          <div className="space-x-4">
            <Link href="/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            Collaborate and Create in Real-time
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            Draw, sketch, and brainstorm together with your team in a shared
            digital workspace.
          </p>
          <div className="mt-10">
            <Link href="/signup">
              <Button size="lg" className="px-8">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
              <Brush className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-6 text-xl font-semibold">
              Intuitive Drawing Tools
            </h3>
            <p className="mt-2 text-muted-foreground">
              Simple yet powerful tools for all your creative needs
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-6 text-xl font-semibold">
              Real-time Collaboration
            </h3>
            <p className="mt-2 text-muted-foreground">
              Work together with your team in real-time
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-6 text-xl font-semibold">Instant Sharing</h3>
            <p className="mt-2 text-muted-foreground">
              Share your work with anyone, anywhere
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
