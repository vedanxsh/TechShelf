const MenuModel = require('../models/menuModel');

exports.getMenu = async (req, res, next) => {
  try {
    const { category, search, isVeg, availableOnly } = req.query;
    const items = MenuModel.getAll({ category, search, isVeg, availableOnly });

    return res.status(200).json({
      success: true,
      count: items.length,
      items
    });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = MenuModel.getCategories();
    return res.status(200).json({
      success: true,
      categories
    });
  } catch (err) {
    next(err);
  }
};

exports.getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = MenuModel.getById(id);

    if (!item) {
      return res.status(404).json({ success: false, message: `Menu item #${id} not found` });
    }

    return res.status(200).json({
      success: true,
      item
    });
  } catch (err) {
    next(err);
  }
};

exports.createItem = async (req, res, next) => {
  try {
    const { name, desc, price, category, isVeg, prepTime, icon, available } = req.body;

    const newItem = MenuModel.create({
      name,
      desc,
      price,
      category,
      isVeg,
      prepTime,
      icon,
      available
    });

    return res.status(201).json({
      success: true,
      message: `Menu item "${newItem.name}" created successfully`,
      item: newItem
    });
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = MenuModel.update(id, req.body);

    return res.status(200).json({
      success: true,
      message: `Menu item #${id} updated successfully`,
      item: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = MenuModel.delete(id);

    return res.status(200).json({
      success: true,
      message: `Menu item "${deleted.name}" removed from cafeteria menu`,
      item: deleted
    });
  } catch (err) {
    next(err);
  }
};

exports.toggleItemStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = MenuModel.toggleAvailability(id);

    return res.status(200).json({
      success: true,
      message: `Item #${id} is now ${item.available ? 'IN STOCK' : 'OUT OF STOCK'}`,
      item
    });
  } catch (err) {
    next(err);
  }
};
