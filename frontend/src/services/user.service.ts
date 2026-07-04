import api from "../lib/axios";



export const getNxtUserbyId = async (id: number) => {
  const res = await api.get(`/api/users/nxt/${id}`);
  return res.data.data;
}