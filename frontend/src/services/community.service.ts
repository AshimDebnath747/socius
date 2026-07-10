import api from "../lib/axios";

export interface CreateCommunityPayload {
  name: string;
  description: string;
  rules: string;
  is_private: boolean;
}


export const createCommunity = async (payload: CreateCommunityPayload) => {

  const res = await api.post("api/communities", payload)
  return res.data
}

// Get all the communities

export const getAllCommunities = async () => {

  const res = await api.get("api/communities")
  const communities = res.data.data.map(
    ({ is_private, created_at, ...rest }: any) => ({
      ...rest,
      isPrivate: is_private,
      createdAt: created_at,
    })
  );
  return communities
}

console.log(getAllCommunities())