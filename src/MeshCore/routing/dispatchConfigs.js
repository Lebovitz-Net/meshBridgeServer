export const dispatchConfigs = {
    DeviceInfo: (data) => {
        console.log('.../DeviceFinfo data', data);
    },
    Err: (packet) => {
        console.log('.../Error', packet);
    },
    
}