import { Permissions, webMethod } from 'wix-web-module';
import { fetch } from 'wix-fetch';

const WEBHOOK_URL = 'https://manage.wix.com/_api/webhook-trigger/report/97bf5405-2507-4744-b53a-0f1a5a61796d/44b5be81-38fa-47c9-a354-374a1e97e7f6';

export const callPublishWebhook = webMethod(
  Permissions.Admin,
  async () => {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST'
    });

    return response.ok;
  }
);
