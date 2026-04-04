class AddApprovalStatusToSyncLogs < ActiveRecord::Migration[8.1]
  def change
    add_column :sync_logs, :approval_status, :string, default: "pending", null: false
    add_column :sync_logs, :approved_at, :datetime

    reversible do |dir|
      dir.up do
        execute <<~SQL
          UPDATE sync_logs SET approval_status = 'approved', approved_at = finished_at
          WHERE status = 'completed'
        SQL
      end
    end
  end
end
