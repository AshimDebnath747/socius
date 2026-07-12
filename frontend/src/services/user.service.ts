
import api from "../lib/axios";

export const getNextUserById = async (
  helper_id: number,
  requester_id: number
) => {
  const res = await api.post("/api/user/next", {
    helper_id,
    requester_id,
  });

  return res.data.data;
};
export const getUserProfile = async (id?: number | string) => {
  const url = id ? `/api/user/${id}` : "/api/user";

  const profile = await api.get(url);

  return profile.data.data;
};


export const uploadAvatar = async (formData: FormData) => {
  const res = await api.patch("/api/user/avatar", formData, {
    withCredentials: true,
  });

  return res.data.data;
};

export const updateProfile = async (data: {
  name: string;
  headline: string;
  bio: string;
  about: string;
  location: string;
  website: string;
  skills: string[];
}) => {
  const res = await api.put("/api/user/me", data);

  return res.data.data;
};