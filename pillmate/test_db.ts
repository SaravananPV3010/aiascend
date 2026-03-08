import { VaultService } from './backend/vault/vault.service.js';

try {
  VaultService.addLogEntry('non_existent_user', {
    id: 'test_log_1',
    type: 'medication_added',
    timestamp: new Date().toISOString(),
    details: { msg: 'Test' }
  });
  console.log('Success inserted!');
} catch (e) {
  console.log('Error inserting:', e);
}
