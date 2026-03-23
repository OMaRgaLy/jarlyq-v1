'use client';

import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { googleLogin } from '../lib/auth';

interface Props {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

export function GoogleLoginButton({ onSuccess, onError }: Props) {
  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      onError?.('Не удалось получить токен Google');
      return;
    }
    try {
      await googleLogin(credentialResponse.credential);
      onSuccess?.();
    } catch {
      onError?.('Ошибка входа через Google');
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => onError?.('Ошибка входа через Google')}
      useOneTap={false}
      text="signin_with"
      shape="rectangular"
      theme="outline"
      size="large"
      width="100%"
    />
  );
}
