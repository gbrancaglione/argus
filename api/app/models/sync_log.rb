class SyncLog < ApplicationRecord
  belongs_to :user
  has_many :transactions

  validates :status, :from_date, :to_date, :started_at, presence: true

  scope :recent, -> { order(started_at: :desc) }
  scope :pending_approval, -> { where(approval_status: "pending") }

  def complete!(stats)
    update!(
      status: "completed",
      finished_at: Time.current,
      **stats
    )
  end

  def fail!(message)
    update!(
      status: "failed",
      finished_at: Time.current,
      error_message: message
    )
  end

  def approve!
    update!(approval_status: "approved", approved_at: Time.current)
  end

  def reject!
    Transaction.unscoped.where(sync_log_id: id).delete_all
    update!(approval_status: "rejected")
  end

  def pending_approval?
    approval_status == "pending"
  end
end
