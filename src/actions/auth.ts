"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const STAFF_USERNAME = process.env.STAFF_USERNAME || "staff";
const STAFF_PASSWORD = process.env.STAFF_PASSWORD || "staff123";

export async function login(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set("auth-token", "admin", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    return { success: true };
  } else if (username === STAFF_USERNAME && password === STAFF_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set("auth-token", "staff", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    return { success: true };
  }
  
  return { success: false, error: "Invalid username or password" };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
  redirect("/login");
}

export async function getUserRole() {
  const cookieStore = await cookies();
  return cookieStore.get("auth-token")?.value || null;
}
