"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import {
    User,
    FileText,
    Edit3,
    Save,
    X,
    Upload,
    Calendar,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    GraduationCap,
    Star,
    Trash2
} from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    image?: string;
    phone?: string;
    location?: string;
    bio?: string;
    profession?: string;
    experience?: string;
    education?: string;
    skills?: string[];
    createdAt: string;
}

interface Resume {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        phone: "",
        location: "",
        bio: "",
        profession: "",
        experience: "",
        education: "",
        skills: [] as string[],
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/signin");
        } else if (status === "authenticated") {
            fetchProfile();
            fetchResumes();
        }
    }, [status, router]);

    const fetchProfile = async () => {
        try {
            const response = await fetch("/api/profile");
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
                setEditForm({
                    name: data.name || "",
                    phone: data.phone || "",
                    location: data.location || "",
                    bio: data.bio || "",
                    profession: data.profession || "",
                    experience: data.experience || "",
                    education: data.education || "",
                    skills: data.skills || [],
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            toast.error("Failed to load profile");
        }
    };

    const fetchResumes = async () => {
        try {
            const response = await fetch("/api/resume");
            if (response.ok) {
                const data = await response.json();
                setResumes(data.resumes || []);
            }
        } catch (error) {
            console.error("Error fetching resumes:", error);
        }
    };

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(editForm),
            });

            if (response.ok) {
                const updatedProfile = await response.json();
                setProfile(updatedProfile);
                setIsEditing(false);
                toast.success("Profile updated successfully");
            } else {
                throw new Error("Failed to update profile");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteResume = async (resumeId: number) => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/resume/${resumeId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setResumes(resumes.filter(resume => resume.id !== resumeId));
                toast.success("Resume deleted successfully");
                setDeleteDialogOpen(false);
                setResumeToDelete(null);
            } else {
                throw new Error("Failed to delete resume");
            }
        } catch (error) {
            console.error("Error deleting resume:", error);
            toast.error("Failed to delete resume");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteClick = (resume: Resume) => {
        setResumeToDelete(resume);
        setDeleteDialogOpen(true);
    };

    const handleAddSkill = (skill: string) => {
        if (skill.trim() && !editForm.skills.includes(skill.trim())) {
            setEditForm({
                ...editForm,
                skills: [...editForm.skills, skill.trim()]
            });
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setEditForm({
            ...editForm,
            skills: editForm.skills.filter(skill => skill !== skillToRemove)
        });
    };

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-clip-textwh">
                        My Profile
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your profile information and uploaded resumes
                    </p>
                </div>

                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="profile" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Profile Information
                        </TabsTrigger>
                        <TabsTrigger value="resumes" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            My Resumes
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                                <div>
                                    <CardTitle className="text-2xl">Profile Information</CardTitle>
                                    <CardDescription>
                                        Update your personal information and professional details
                                    </CardDescription>
                                </div>
                                {!isEditing ? (
                                    <Button onClick={() => setIsEditing(true)} variant="outline">
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleSaveProfile}
                                            disabled={isLoading}
                                            size="sm"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {isLoading ? "Saving..." : "Save"}
                                        </Button>
                                        <Button
                                            onClick={() => setIsEditing(false)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Profile Header */}
                                <div className="flex items-center space-x-6">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src={session.user?.image || ""} />
                                        <AvatarFallback className="text-2xl">
                                            {session.user?.name?.charAt(0).toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-semibold">
                                            {profile?.name || session.user?.name}
                                        </h3>
                                        <div className="flex items-center text-muted-foreground">
                                            <Mail className="h-4 w-4 mr-2" />
                                            {session.user?.email}
                                        </div>
                                        <div className="flex items-center text-muted-foreground">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Member since {new Date(profile?.createdAt || "").toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        {isEditing ? (
                                            <Input
                                                id="name"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                placeholder="Enter your full name"
                                            />
                                        ) : (
                                            <div className="flex items-center py-2">
                                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                                {profile?.name || "Not specified"}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        {isEditing ? (
                                            <Input
                                                id="phone"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                placeholder="Enter your phone number"
                                            />
                                        ) : (
                                            <div className="flex items-center py-2">
                                                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                                                {profile?.phone || "Not specified"}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="location">Location</Label>
                                        {isEditing ? (
                                            <Input
                                                id="location"
                                                value={editForm.location}
                                                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                                placeholder="City, Country"
                                            />
                                        ) : (
                                            <div className="flex items-center py-2">
                                                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                                {profile?.location || "Not specified"}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="profession">Profession</Label>
                                        {isEditing ? (
                                            <Input
                                                id="profession"
                                                value={editForm.profession}
                                                onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })}
                                                placeholder="e.g., Software Engineer"
                                            />
                                        ) : (
                                            <div className="flex items-center py-2">
                                                <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                                                {profile?.profession || "Not specified"}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bio */}
                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    {isEditing ? (
                                        <Textarea
                                            id="bio"
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                            placeholder="Tell us about yourself..."
                                            className="min-h-[100px]"
                                        />
                                    ) : (
                                        <div className="py-2 text-sm text-muted-foreground">
                                            {profile?.bio || "No bio added yet"}
                                        </div>
                                    )}
                                </div>

                                {/* Experience */}
                                <div className="space-y-2">
                                    <Label htmlFor="experience">Experience</Label>
                                    {isEditing ? (
                                        <Textarea
                                            id="experience"
                                            value={editForm.experience}
                                            onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                                            placeholder="Describe your work experience..."
                                            className="min-h-[100px]"
                                        />
                                    ) : (
                                        <div className="py-2 text-sm text-muted-foreground">
                                            {profile?.experience || "No experience added yet"}
                                        </div>
                                    )}
                                </div>

                                {/* Education */}
                                <div className="space-y-2">
                                    <Label htmlFor="education">Education</Label>
                                    {isEditing ? (
                                        <Textarea
                                            id="education"
                                            value={editForm.education}
                                            onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                                            placeholder="Describe your educational background..."
                                            className="min-h-[100px]"
                                        />
                                    ) : (
                                        <div className="flex items-start py-2">
                                            <GraduationCap className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                                {profile?.education || "No education added yet"}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Skills */}
                                <div className="space-y-2">
                                    <Label>Skills</Label>
                                    {isEditing ? (
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                {editForm.skills.map((skill, index) => (
                                                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                                        {skill}
                                                        <X
                                                            className="h-3 w-3 cursor-pointer"
                                                            onClick={() => handleRemoveSkill(skill)}
                                                        />
                                                    </Badge>
                                                ))}
                                            </div>
                                            <Input
                                                placeholder="Add a skill and press Enter"
                                                onKeyPress={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleAddSkill(e.currentTarget.value);
                                                        e.currentTarget.value = "";
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2 py-2">
                                            {profile?.skills && profile.skills.length > 0 ? (
                                                profile.skills.map((skill, index) => (
                                                    <Badge key={index} variant="outline">
                                                        {skill}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-sm text-muted-foreground">No skills added yet</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="resumes" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-2xl">My Resumes</CardTitle>
                                        <CardDescription>
                                            Manage your uploaded resumes and download them anytime
                                        </CardDescription>
                                    </div>
                                    <Button onClick={() => router.push("/upload")}>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload New Resume
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {resumes.length === 0 ? (
                                    <Alert>
                                        <FileText className="h-4 w-4" />
                                        <AlertDescription>
                                            No resumes uploaded yet. Upload your first resume to get started with AI analysis.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {resumes.map((resume) => (
                                            <Card key={resume.id} className="hover:shadow-md transition-shadow">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                                                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold truncate">
                                                                    {resume.title}
                                                                </h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Created {new Date(resume.createdAt).toLocaleDateString()}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Updated {new Date(resume.updatedAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-4">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.push(`/dashboard/analyze/${resume.id}`)}
                                                        >
                                                            <Star className="h-4 w-4 mr-2" />
                                                            Analyze
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteClick(resume)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Confirmation Dialog for Resume Deletion */}
                <DeleteConfirmationDialog
                    isOpen={deleteDialogOpen}
                    onClose={() => {
                        setDeleteDialogOpen(false);
                        setResumeToDelete(null);
                    }}
                    onConfirm={() => {
                        if (resumeToDelete) {
                            handleDeleteResume(resumeToDelete.id);
                        }
                    }}
                    title="Delete Resume"
                    description="Are you sure you want to delete this resume? This action cannot be undone and will also remove all associated AI analysis data from our servers."
                    itemName={resumeToDelete?.title}
                    isLoading={isDeleting}
                />
            </div>
        </div>
    );
}