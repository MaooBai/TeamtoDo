import apiService from '../services/apiService';
import { useMutation } from '@tanstack/react-query';
import { MessageRequest } from '../types/auth';

export const sendMessage2One = () =>{
    return useMutation({
        mutationFn: async(data: MessageRequest) =>
             {
                await apiService.messages.sendMessage(data)
                console.log('发送成功');
             }
    })
}

export const sendMessageAuth = () =>{
    const sendMessgeMutation = sendMessage2One()
    return {
        sendMessageMutate : sendMessgeMutation.mutate,
        isLoadingSend: sendMessgeMutation.isPending,
    }
}
