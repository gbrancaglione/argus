class AddSyncLogToTransactions < ActiveRecord::Migration[8.1]
  def change
    add_reference :transactions, :sync_log, foreign_key: true, null: true
    add_column :transactions, :sync_action, :string
    add_index :transactions, [:sync_log_id, :sync_action]
  end
end
