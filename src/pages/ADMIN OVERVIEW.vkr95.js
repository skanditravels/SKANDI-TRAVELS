import { callPublishWebhook } from 'backend/publishSite.web';

$w.onReady(() => {
  $w('#buttonPublish').onClick(async () => {
    $w('#buttonPublish').disable();

    try {
      const success = await callPublishWebhook();
      console.log(success ? 'Publish webhook sent' : 'Publish webhook failed');
    } catch (error) {
      console.error('Could not call the publish webhook:', error);
    } finally {
      $w('#buttonPublish').enable();
    }
  });
});
