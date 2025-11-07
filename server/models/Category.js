const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '카테고리명은 필수입니다'],
    trim: true,
    unique: true,
    maxlength: [50, '카테고리명은 50자 이하여야 합니다']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, '카테고리 설명은 500자 이하여야 합니다']
  },
  image: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0,
    min: [0, '레벨은 0 이상이어야 합니다'],
    max: [2, '최대 2단계까지만 가능합니다']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  seo: {
    title: {
      type: String,
      trim: true,
      maxlength: [60, 'SEO 제목은 60자 이하여야 합니다']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [160, 'SEO 설명은 160자 이하여야 합니다']
    },
    keywords: [{
      type: String,
      trim: true
    }]
  },
  productCount: {
    type: Number,
    default: 0,
    min: [0, '상품 수는 0 이상이어야 합니다']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual for parent category
categorySchema.virtual('parentCategory', {
  ref: 'Category',
  localField: 'parent',
  foreignField: '_id',
  justOne: true
});

// Virtual for breadcrumb
categorySchema.virtual('breadcrumb').get(function() {
  const breadcrumb = [];
  let current = this;
  
  while (current) {
    breadcrumb.unshift({
      id: current._id,
      name: current.name,
      slug: current.slug
    });
    current = current.parentCategory;
  }
  
  return breadcrumb;
});

// Method to get all subcategories (recursive)
categorySchema.methods.getAllSubcategories = async function() {
  const subcategories = await this.constructor.find({ parent: this._id });
  let allSubcategories = [...subcategories];
  
  for (const subcategory of subcategories) {
    const nestedSubcategories = await subcategory.getAllSubcategories();
    allSubcategories = allSubcategories.concat(nestedSubcategories);
  }
  
  return allSubcategories;
};

// Method to update product count
categorySchema.methods.updateProductCount = async function() {
  const Product = require('./Product');
  const count = await Product.countDocuments({ category: this._id, isActive: true });
  this.productCount = count;
  return this.save();
};

// Static method to create slug from name
categorySchema.statics.createSlug = function(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 특수문자 제거
    .replace(/[\s_-]+/g, '-') // 공백과 언더스코어를 하이픈으로
    .replace(/^-+|-+$/g, ''); // 앞뒤 하이픈 제거
};

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true })
    .populate('parent', 'name slug')
    .sort({ level: 1, sortOrder: 1, name: 1 });
  
  const buildTree = (parentId = null) => {
    return categories
      .filter(category => {
        if (parentId === null) return !category.parent;
        return category.parent && category.parent._id.toString() === parentId.toString();
      })
      .map(category => ({
        ...category.toObject(),
        subcategories: buildTree(category._id)
      }));
  };
  
  return buildTree();
};

// Static method to find category by slug
categorySchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug: slug.toLowerCase(), isActive: true });
};

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.constructor.createSlug(this.name);
  }
  
  // Set level based on parent
  if (this.parent) {
    // This will be populated in the actual save if parent exists
    this.level = 1;
  } else {
    this.level = 0;
  }
  
  next();
});

// Pre-save middleware to set level
categorySchema.pre('save', async function(next) {
  if (this.parent) {
    const parentCategory = await this.constructor.findById(this.parent);
    if (parentCategory) {
      this.level = parentCategory.level + 1;
      
      // Prevent more than 2 levels
      if (this.level > 2) {
        const error = new Error('카테고리는 최대 2단계까지만 가능합니다');
        return next(error);
      }
    }
  }
  
  next();
});

// Post-save middleware to update parent's product count
categorySchema.post('save', async function(doc) {
  if (doc.parent) {
    const parentCategory = await this.constructor.findById(doc.parent);
    if (parentCategory) {
      await parentCategory.updateProductCount();
    }
  }
});

// Post-remove middleware to update parent's product count
categorySchema.post('remove', async function(doc) {
  if (doc.parent) {
    const parentCategory = await this.constructor.findById(doc.parent);
    if (parentCategory) {
      await parentCategory.updateProductCount();
    }
  }
});

module.exports = mongoose.model('Category', categorySchema);
