"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { authService, UpdateProfileData } from "@/lib/auth-service";

interface UserProfileProps {
  className?: string;
}

export function UserProfile({ className = "" }: UserProfileProps) {
  const { user, logout, refreshUser } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    city: "",
    state: "",
    country: "",
    address: "",
    next_of_kin_full_name: "",
    next_of_kin_phone_number: "",
    next_of_kin_address: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProfileMessage("");

    try {
      const updateData: UpdateProfileData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        city: profileData.city,
        state: profileData.state,
        country: profileData.country,
        address: profileData.address,
      };

      const response = await authService.updateProfile(updateData);

      if (response.success) {
        setProfileMessage("Profile updated successfully");
        setIsUpdatingProfile(false);
        // Update the user data
        await refreshUser();
      } else {
        setProfileMessage(response.error || "Failed to update profile");
      }
    } catch {
      setProfileMessage("An error occurred while updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPasswordMessage("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage("New passwords don't match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.changePassword({
        password: passwordData.newPassword,
      });

      if (response.success) {
        setPasswordMessage("Password changed successfully");
        setPasswordData({
          newPassword: "",
          confirmPassword: "",
        });
        setIsChangingPassword(false);
      } else {
        setPasswordMessage(response.error || "Failed to change password");
      }
    } catch {
      setPasswordMessage("An error occurred while changing password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* User Info */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Profile Information
          </h3>
          <button
            onClick={() => {
              setIsUpdatingProfile(!isUpdatingProfile);
              if (!isUpdatingProfile && user) {
                setProfileData({
                  first_name: user.first_name || "",
                  last_name: user.last_name || "",
                  email: user.email || "",
                  city: user.city || "",
                  state: user.state || "",
                  country: user.country || "",
                  address: user.address || "",
                  next_of_kin_full_name: "",
                  next_of_kin_phone_number: "",
                  next_of_kin_address: "",
                });
              }
            }}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            {isUpdatingProfile ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {isUpdatingProfile ? (
          <form onSubmit={handleProfileUpdate} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={profileData.first_name}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      first_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileData.last_name}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      last_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) =>
                    setProfileData({ ...profileData, city: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={profileData.state}
                  onChange={(e) =>
                    setProfileData({ ...profileData, state: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={profileData.country}
                  onChange={(e) =>
                    setProfileData({ ...profileData, country: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={profileData.address}
                onChange={(e) =>
                  setProfileData({ ...profileData, address: e.target.value })
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Next of Kin Section */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">
                Next of Kin Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.next_of_kin_full_name}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        next_of_kin_full_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.next_of_kin_phone_number}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        next_of_kin_phone_number: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 08012345678"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={profileData.next_of_kin_address}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      next_of_kin_address: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            {profileMessage && (
              <div
                className={`text-sm ${
                  profileMessage.includes("successfully")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {profileMessage}
              </div>
            )}
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Updating..." : "Update Profile"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsUpdatingProfile(false);
                  setProfileMessage("");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-500">Name:</span>
              <p className="text-sm text-gray-900">
                {user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.name}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <p className="text-sm text-gray-900">{user.email}</p>
            </div>
            {user.phone_number && (
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Phone:
                </span>
                <p className="text-sm text-gray-900">{user.phone_number}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-500">Role:</span>
              <p className="text-sm text-gray-900 capitalize">
                {user.role?.replace("_", " ").toLowerCase() || "Unknown"}
              </p>
            </div>
            {user.park && (
              <div>
                <span className="text-sm font-medium text-gray-500">Park:</span>
                <p className="text-sm text-gray-900">{user.park.name}</p>
                <p className="text-xs text-gray-500">{user.park.address}</p>
              </div>
            )}
            {(user.city || user.state || user.country) && (
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Location:
                </span>
                <p className="text-sm text-gray-900">
                  {[user.city, user.state, user.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            )}
            {user.address && (
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Address:
                </span>
                <p className="text-sm text-gray-900">{user.address}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Password Change */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Change Password
          </h3>
          <button
            onClick={() => setIsChangingPassword(!isChangingPassword)}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            {isChangingPassword ? "Cancel" : "Change Password"}
          </button>
        </div>

        {isChangingPassword && (
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
                minLength={8}
              />
            </div>
            {passwordMessage && (
              <div
                className={`text-sm ${
                  passwordMessage.includes("successfully")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {passwordMessage}
              </div>
            )}
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Changing..." : "Change Password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordData({
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setPasswordMessage("");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Logout Button */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
