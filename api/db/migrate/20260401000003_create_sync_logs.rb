class CreateSyncLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :sync_logs do |t|
      t.references :user, null: false, foreign_key: true
      t.string :status, null: false, default: "running"
      t.date :from_date, null: false
      t.date :to_date, null: false
      t.integer :accounts_synced, default: 0
      t.integer :transactions_created, default: 0
      t.integer :transactions_updated, default: 0
      t.integer :transactions_skipped, default: 0
      t.text :error_message
      t.datetime :started_at, null: false
      t.datetime :finished_at
      t.timestamps
    end

    add_index :sync_logs, [:user_id, :started_at]
  end
end
