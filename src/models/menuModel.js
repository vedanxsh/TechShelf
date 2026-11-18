const fs = require('fs');
const config = require('../config');

class MenuModel {
  static _read() {
    try {
      if (!fs.existsSync(config.paths.menuFile)) {
        return [];
      }
      const data = fs.readFileSync(config.paths.menuFile, 'utf8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error('[MenuModel._read] Error reading menu file:', err.message);
      return [];
    }
  }

  static _write(items) {
    try {
      fs.writeFileSync(config.paths.menuFile, JSON.stringify(items, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[MenuModel._write] Error writing menu file:', err.message);
      throw new Error('Failed to persist menu data');
    }
  }

  static getAll(filters = {}) {
    let items = this._read();

    // If filter 'availableOnly' is set, exclude out of stock items
    if (filters.availableOnly === true || filters.availableOnly === 'true') {
      items = items.filter(item => item.available !== false);
    }

    if (filters.category && filters.category !== 'all') {
      items = items.filter(item => item.category.toLowerCase() === filters.category.toLowerCase());
    }

    if (filters.isVeg !== undefined && filters.isVeg !== '') {
      const isVegBool = filters.isVeg === true || filters.isVeg === 'true';
      items = items.filter(item => item.isVeg === isVegBool);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(item => 
        item.name.toLowerCase().includes(q) || 
        (item.desc && item.desc.toLowerCase().includes(q))
      );
    }

    return items;
  }

  static getById(id) {
    const numId = parseInt(id, 10);
    const items = this._read();
    return items.find(item => item.id === numId) || null;
  }

  static getCategories() {
    const items = this._read();
    const categories = Array.from(new Set(items.map(item => item.category)));
    return ['all', ...categories];
  }

  static create(itemData) {
    if (!itemData.name || itemData.name.trim() === '') {
      const err = new Error('Menu item name is required');
      err.statusCode = 400;
      throw err;
    }

    const price = parseFloat(itemData.price);
    if (isNaN(price) || price < 0) {
      const err = new Error('Valid non-negative price is required');
      err.statusCode = 400;
      throw err;
    }

    const items = this._read();
    const nextId = items.length ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;

    const newItem = {
      id: nextId,
      name: itemData.name.trim(),
      desc: (itemData.desc && itemData.desc.trim()) || 'Freshly prepared at cafeteria counter',
      price: Math.round(price * 100) / 100,
      category: (itemData.category && itemData.category.trim().toLowerCase()) || 'fastfood',
      isVeg: itemData.isVeg !== false && itemData.isVeg !== 'false',
      prepTime: (itemData.prepTime && itemData.prepTime.trim()) || '5-7 mins',
      icon: (itemData.icon && itemData.icon.trim()) || (itemData.isVeg ? '🥗' : '🍗'),
      rating: typeof itemData.rating === 'number' ? itemData.rating : 4.8,
      available: itemData.available !== false && itemData.available !== 'false'
    };

    items.push(newItem);
    this._write(items);
    return newItem;
  }

  static update(id, updateData) {
    const numId = parseInt(id, 10);
    const items = this._read();
    const index = items.findIndex(item => item.id === numId);

    if (index === -1) {
      const err = new Error(`Menu item #${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    const current = items[index];

    if (updateData.name !== undefined) current.name = updateData.name.trim();
    if (updateData.desc !== undefined) current.desc = updateData.desc.trim();
    if (updateData.price !== undefined) {
      const price = parseFloat(updateData.price);
      if (!isNaN(price) && price >= 0) current.price = Math.round(price * 100) / 100;
    }
    if (updateData.category !== undefined) current.category = updateData.category.trim().toLowerCase();
    if (updateData.isVeg !== undefined) current.isVeg = updateData.isVeg === true || updateData.isVeg === 'true';
    if (updateData.prepTime !== undefined) current.prepTime = updateData.prepTime.trim();
    if (updateData.icon !== undefined) current.icon = updateData.icon.trim();
    if (updateData.available !== undefined) current.available = updateData.available === true || updateData.available === 'true';

    items[index] = current;
    this._write(items);
    return current;
  }

  static delete(id) {
    const numId = parseInt(id, 10);
    const items = this._read();
    const index = items.findIndex(item => item.id === numId);

    if (index === -1) {
      const err = new Error(`Menu item #${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    const removed = items.splice(index, 1)[0];
    this._write(items);
    return removed;
  }

  static toggleAvailability(id) {
    const numId = parseInt(id, 10);
    const items = this._read();
    const item = items.find(i => i.id === numId);

    if (!item) {
      const err = new Error(`Menu item #${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    item.available = !item.available;
    this._write(items);
    return item;
  }
}

module.exports = MenuModel;
