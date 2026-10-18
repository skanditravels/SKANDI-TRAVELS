import { Duffel } from '@duffel/api';
import { secrets } from 'wix-secrets-backend.v2';
import { elevate } from 'wix-auth';

const getSecretValue = elevate(secrets.getSecretValue);

export async function getDuffelClient() {
  const { value: token } = await getSecretValue('DUFFEL_ACCESS_TOKEN');
  if (!token) {
    throw new Error('DUFFEL_ACCESS_TOKEN is not configured');
  }
  return new Duffel({ token });
}