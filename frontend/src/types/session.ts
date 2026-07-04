export interface Session {
    id:number;
    help_request_id:number;
    requester_id:number;
    helper_id:number;
    mode:"call"|"text"|null;
    start_time:string|null;
    end_time:string|null;
    status:"active"|"completed"|"cancelled";
}