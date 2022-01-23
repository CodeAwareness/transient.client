import { ManagerOptions, SocketOptions } from 'socket.io-client';

declare type TTransientSocketOptions = ManagerOptions & SocketOptions;
declare type TLogger = {
    error: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    log: (...args: any[]) => void;
    info: (...args: any[]) => void;
};
declare type TTransientHandler = {
    url: string;
    logger?: TLogger;
    onError?: (err: any) => void;
};
declare const tcClient: {
    init: (options: TTransientHandler) => Promise<void>;
    reconnect: () => any;
    setToken: (token: string) => void;
    socketOptions: {
        reconnectionDelayMax: number;
        forceNew: boolean;
        withCredentials: boolean;
        timestampRequests: boolean;
        auth: any;
    };
    transmit: (action: string, data?: any) => Promise<unknown>;
};

export { TLogger, TTransientHandler, TTransientSocketOptions, tcClient as default, tcClient };
