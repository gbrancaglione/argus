class SyncLog < ApplicationRecord
  belongs_to :user

  validates :status, :from_date, :to_date, :started_at, presence: true

  scope :recent, -> { order(started_at: :desc) }

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
end
