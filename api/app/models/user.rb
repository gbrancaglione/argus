class User < ApplicationRecord
  has_secure_password

  has_many :accounts, dependent: :destroy
  has_many :transactions, through: :accounts
  has_many :labels, dependent: :destroy
  has_many :sync_logs, dependent: :destroy

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
end
