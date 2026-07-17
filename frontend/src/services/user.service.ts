
import api from "../lib/axios";

export const getNextUserById = async (
  helperid: number,
  requesterid: number
) => {
  const res = await api.get("/api/user/next", {
    params: {
      helperid,
      requesterid,
    },
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