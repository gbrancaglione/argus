require "test_helper"

class LabelTest < ActiveSupport::TestCase
  test "valid label" do
    assert labels(:groceries).valid?
  end

  test "requires name" do
    label = Label.new(user: users(:admin))
    assert_not label.valid?
    assert_includes label.errors[:name], "can't be blank"
  end

  test "requires unique name per user" do
    duplicate = Label.new(user: users(:admin), name: "Groceries")
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:name], "has already been taken"
  end

  test "allows same name for different users" do
    label = Label.new(user: users(:other), name: "Groceries")
    assert label.valid?
  end

  test "nullifies transactions on destroy" do
    label = labels(:groceries)
    tx = transactions(:grocery_expense)
    assert_equal label, tx.label

    label.destroy!
    assert_nil tx.reload.label_id
  end
end
