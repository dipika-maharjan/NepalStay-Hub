import { API } from "./endpoints";
import axios from "./axios";

export const initiateEsewaPayment = async (amount: number, bookingId: string) => {
    try {
        const response = await axios.post(
            API.PAYMENT.ESEWA_INITIATE,
            { amount, bookingId },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error: Error | any) {
        throw new Error(error.response?.data?.message
            || error.message || 'Payment initiation failed');
    }
};
