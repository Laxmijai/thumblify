import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import type { ReactNode } from "react";
import type { IUser } from "../assets/assets";
import api from "../configs/api";
import { toast } from "react-toastify";

interface AuthContextProps {
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;

  user: IUser | null;
  setUser: (user: IUser | null) => void;

  login: (user: {
    email: string;
    password: string;
  }) => Promise<void>;

  signUp: (user: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;

  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const signUp = async ({
    name,
    email,
    password
  }: {
    name: string;
    email: string;
    password: string;
  }) => {
    try {
      const { data } = await api.post("/api/auth/register", {
        name,
        email,
        password
      });

      if (data.user) {
        setUser(data.user as IUser);
        setIsLoggedIn(true);
      }

      toast.success(data.message);
    } catch (error) {
      console.log(error);
    }
  };

  const login = async ({
    email,
    password
  }: {
    email: string;
    password: string;
  }) => {
    try {
      const { data } = await api.post("/api/auth/login", {
        email,
        password
      });

      if (data.user) {
        setUser(data.user as IUser);
        setIsLoggedIn(true);
      }

      toast.success(data.message);
    } catch (error: any) {
  console.log("STATUS:", error.response?.status);
  console.log("DATA:", error.response?.data);
  console.log("MESSAGE:", error.response?.data?.message);
}
  };

  const logout = async () => {
    try {
      const { data } = await api.post("/api/auth/logout");

      setUser(null);
      setIsLoggedIn(false);

      toast.success(data.message);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchUser = async () => {
    try {
      const { data } = await api.get("/api/auth/verify");

      if (data.user) {
        setUser(data.user as IUser);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value = {
    user,
    setUser,
    isLoggedIn,
    setIsLoggedIn,
    signUp,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};