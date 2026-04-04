class AddInstallmentFieldsToTransactions < ActiveRecord::Migration[8.1]
  def change
    add_column :transactions, :installment_number, :integer
    add_column :transactions, :total_installments, :integer
    add_column :transactions, :purchase_date, :date
    add_column :transactions, :purchase_key, :string

    add_index :transactions, :purchase_key
    add_index :transactions, [:account_id, :purchase_key, :installment_number],
              name: "idx_transactions_installment_lookup"
  end
end
