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