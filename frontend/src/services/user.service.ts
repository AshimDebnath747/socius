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
export const getProfile = async ()=>{
  const profile = await api.get("/api/user/")

  return profile.data.data
}