import api from "../lib/axios";

export interface CreateCommunityPayload {
  name: string;
  description: string;
  rules: string;
  is_private: boolean;
}


export const createCommunity = async(payload:CreateCommunityPayload)=>{

  const res = await api.post("api/communities",payload)
  return res.data
}

// Get all the communities

export const getAllCommunities = async ()=>{

  const res = await api.get("api/communities")
  return res.data.data
}

console.log(getAllCommunities())