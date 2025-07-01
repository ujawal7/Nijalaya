import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FamilyTreeGraph } from "@/components/FamilyTreeGraph";
import { type FamilyMember } from "@shared/schema";
import { Users, TreePine, Info, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function FamilyTreePage() {
  const { user } = useAuth();
  const [selectedRootId, setSelectedRootId] = useState<number | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  const { data: familyMembers = [], isLoading } = useQuery<FamilyMember[]>({
    queryKey: ["/api/family", user?.id],
    enabled: !!user?.id,
  });

  const handleNodeClick = (person: FamilyMember) => {
    setSelectedMember(person);
  };

  const handleNodeDoubleClick = (person: FamilyMember) => {
    setSelectedRootId(person.id);
    setSelectedMember(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <TreePine className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (familyMembers.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/family">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Family
            </Button>
          </Link>
          <TreePine className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold">Family Tree</h1>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Family Members Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add family members first to visualize your family tree
            </p>
            <Link href="/family">
              <Button>
                <Users className="w-4 h-4 mr-2" />
                Add Family Members
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/family">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Family
            </Button>
          </Link>
          <TreePine className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold">Family Tree</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Root Person:</label>
            <Select
              value={selectedRootId?.toString() || ""}
              onValueChange={(value) => {
                setSelectedRootId(value ? parseInt(value) : null);
                setSelectedMember(null);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select root person" />
              </SelectTrigger>
              <SelectContent>
                {familyMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                How to use the Family Tree:
              </p>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Select a root person from the dropdown to center the tree around them</li>
                <li>• Click on any family member to see their details</li>
                <li>• Double-click on any family member to make them the new root</li>
                <li>• Relationships are determined by the relationship field in family member profiles</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tree Visualization */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="w-5 h-5" />
                Family Tree Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="h-[600px] w-full">
                {selectedRootId ? (
                  <FamilyTreeGraph
                    people={familyMembers}
                    rootPersonId={selectedRootId}
                    onNodeClick={handleNodeClick}
                    onNodeDoubleClick={handleNodeDoubleClick}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <TreePine className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Select a root person to display the family tree</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Member Details */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {selectedMember ? "Member Details" : "Family Overview"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMember ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedMember.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedMember.gender || "Not specified"}
                    </p>
                  </div>
                  
                  {selectedMember.relationship && (
                    <div>
                      <label className="text-sm font-medium">Relationship:</label>
                      <p className="text-sm">{selectedMember.relationship}</p>
                    </div>
                  )}
                  
                  {selectedMember.birthDate && (
                    <div>
                      <label className="text-sm font-medium">Birth Date:</label>
                      <p className="text-sm">
                        {new Date(selectedMember.birthDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {selectedMember.notes && (
                    <div>
                      <label className="text-sm font-medium">Notes:</label>
                      <p className="text-sm">{selectedMember.notes}</p>
                    </div>
                  )}

                  <Button 
                    onClick={() => setSelectedRootId(selectedMember.id)}
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                  >
                    <TreePine className="w-4 h-4 mr-2" />
                    Make Root Person
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{familyMembers.length}</p>
                    <p className="text-sm text-muted-foreground">Family Members</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Quick Actions:</p>
                    <div className="space-y-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => setSelectedRootId(familyMembers[0]?.id)}
                        disabled={!familyMembers[0]}
                      >
                        View First Member
                      </Button>
                      <Link href="/family" className="block">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          Add More Members
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Click on any family member in the tree to see their details here.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}