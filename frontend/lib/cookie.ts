import Cookies from "js-cookie";

const AUTH_COOKIE_NAME = "auth_token";
const BACKEND_COOKIE_NAME = "token";
const USER_COOKIE_NAME = "user_data";

const getServerCookieStore = async () => {
  if (typeof window !== "undefined") {
    return null;
  }

  try {
    const { cookies } = await import("next/headers");
    return await cookies();
  } catch {
    return null;
  }
};

export const setAuthToken = async (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
    Cookies.set(AUTH_COOKIE_NAME, token, { path: "/", sameSite: "lax" });
    Cookies.set(BACKEND_COOKIE_NAME, token, { path: "/", sameSite: "lax" });
    return;
  }

  const cookieStore = await getServerCookieStore();
  if (cookieStore) {
    cookieStore.set({ name: AUTH_COOKIE_NAME, value: token, path: "/" });
    cookieStore.set({ name: BACKEND_COOKIE_NAME, value: token, path: "/" });
  }
};

export const getAuthToken = async () => {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("token") ||
      Cookies.get(AUTH_COOKIE_NAME) ||
      Cookies.get(BACKEND_COOKIE_NAME) ||
      null
    );
  }

  const cookieStore = await getServerCookieStore();
  if (!cookieStore) {
    return null;
  }

  return (
    cookieStore.get(AUTH_COOKIE_NAME)?.value ||
    cookieStore.get(BACKEND_COOKIE_NAME)?.value ||
    null
  );
};

export const setUserData = async (userData: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_COOKIE_NAME, JSON.stringify(userData));
    Cookies.set(USER_COOKIE_NAME, JSON.stringify(userData), {
      path: "/",
      sameSite: "lax",
    });
    return;
  }

  const cookieStore = await getServerCookieStore();
  if (cookieStore) {
    cookieStore.set({
      name: USER_COOKIE_NAME,
      value: JSON.stringify(userData),
      path: "/",
    });
  }
};

export const getUserData = async () => {
  if (typeof window !== "undefined") {
    const userData = localStorage.getItem(USER_COOKIE_NAME);
    if (userData) {
      return JSON.parse(userData);
    }

    const cookieValue = Cookies.get(USER_COOKIE_NAME);
    if (cookieValue) {
      return JSON.parse(cookieValue);
    }

    return null;
  }

  const cookieStore = await getServerCookieStore();
  if (!cookieStore) {
    return null;
  }

  const userData = cookieStore.get(USER_COOKIE_NAME)?.value;
  if (userData) {
    return JSON.parse(userData);
  }
  return null;
};

export const clearAuthCookies = async () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem(USER_COOKIE_NAME);
    Cookies.remove(AUTH_COOKIE_NAME, { path: "/" });
    Cookies.remove(BACKEND_COOKIE_NAME, { path: "/" });
    Cookies.remove(USER_COOKIE_NAME, { path: "/" });
    return;
  }

  const cookieStore = await getServerCookieStore();
  if (cookieStore) {
    cookieStore.delete(AUTH_COOKIE_NAME);
    cookieStore.delete(BACKEND_COOKIE_NAME);
    cookieStore.delete(USER_COOKIE_NAME);
  }
};
