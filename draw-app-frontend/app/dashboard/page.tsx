"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Brush, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [roomName, setRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const router = useRouter();

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    setIsCreating(true);
    //   try {
    //     const { data: { user } } = {}

    //     const { data: room, error } = {}

    //     if (error) throw error;

    //     setRoomName("");
    //     router.push(`/room/${room.id}`);
    //   } catch (error) {
    //     console.error("Error creating room:", error);
    //   } finally {
    //     setIsCreating(false);
    //   }
    // };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Brush className="h-6 w-6" />
            <span className="text-xl font-bold">Draw App</span>
          </div>
          <Button variant="ghost" onClick={() => {}}>
            Sign Out
          </Button>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Create Room Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Room</CardTitle>
              <CardDescription>
                Start a new drawing room and invite others to collaborate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createRoom} className="flex space-x-4">
                <Input
                  placeholder="Enter room name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={isCreating}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Room
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Rooms List */}
          <div className="mt-8 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Link key={room.id} href={`/room/${room.id}`}>
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                    <CardDescription>
                      Created {new Date(room.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
