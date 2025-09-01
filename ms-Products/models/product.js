import mongoose from 'mongoose';

const productSchema = mongoose.Schema({ 
    name  : {
        type  : String,
        required : [true, 'Product name is required'],
    },

    description  : {
        type  : String,
        required : [true, 'Product description is required'],
    },
    price  : {
        type  : Number,
        required : [true, 'Product price is required'],
        min : [0, 'Price must be at least 0']
    },
    type  : {
        type  : String,
        required : [true, 'Product type is required'],
        enum:{ 
            values :  ['Fashion', 'Gifts', 'Sports', 'Electronics', 'Home & Living', 'Beauty', 'toys', 'books'],
            message : '{VALUE} is not a valid product type'
        }
    },
    quantityAvailable  : {
        type  : Number,
        required : [true, 'Product Quantity is required'],
    },
    sizeAvailable  : {
        type  : [String],
        required: [true, 'size field is required'],
    },
    colorAvailable  : {
        type  : [String],
        required: [true, 'At least one color must be available'],
        validate : {
            validator : function (array) {
                return array.length > 0;
            },
            message : 'color array can not be empty'
        }
    },
    images : {
        type : [String],
        required: [true, 'At least one image must be available'],
        validate : {
            validator : function (array) {
                return array.length > 0;
            },
            message : 'image array can not be empty'
        }
    },
    rate : {
        type : String,
        default : 1
    },
    reviewsNumber : {
        type : String,
        default : 100
    },
    finished : {
        type : Boolean , 

    },
    sellerId :  {
        type : String ,
        required : true,
    }

});

export default mongoose.model('products' , productSchema);