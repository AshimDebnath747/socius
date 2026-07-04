import api from "../lib/axios";

export const getSessions = async () => {
    const res = await api.get("/api/sessions");
    return res.data.data;
};

export const getSessionById = async (id:number) => {
    const res = await api.get(`/api/sessions/${id}`);
    return res.data.data;
};

export const endSession = async (id:number) => {
    const res = await api.patch(`/api/sessions/${id}/end`);
    return res.data;
};