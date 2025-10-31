import { Document, Model, Schema, model, models } from 'mongoose';

export interface IWhatsAppNumber extends Document {
    userId: string;
    phoneNumber: string;
    phoneNumberId?: string;
    displayName?: string;
    linkedAgentId?: string;
    webhookUrl?: string;
    status: 'active' | 'inactive';
    lastInteractionAt?: Date;
    settings?: Record<string, unknown>;
    metaConfig?: {
        appId: string;
        appSecret: string;
        businessId: string;
        accessToken: string;
        graphApiVersion?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

type SchemaIndexOptions = Parameters<Schema<IWhatsAppNumber>['index']>[1];
type SchemaIndexEntry = [Record<string, unknown>, SchemaIndexOptions | undefined];

const INDEX_METADATA_KEY = Symbol('declaredIndexes');

const getDeclaredIndexes = (schema: Schema<IWhatsAppNumber>): SchemaIndexEntry[] => {
    const typedSchema = schema as unknown as {
        indexes?: () => SchemaIndexEntry[];
        [INDEX_METADATA_KEY]?: SchemaIndexEntry[];
    };

    if (typeof typedSchema.indexes === 'function') {
        return typedSchema.indexes();
    }

    if (!typedSchema[INDEX_METADATA_KEY]) {
        typedSchema[INDEX_METADATA_KEY] = [];
    }

    return typedSchema[INDEX_METADATA_KEY] as SchemaIndexEntry[];
};

const WhatsAppNumberSchema = new Schema<IWhatsAppNumber>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            trim: true,
        },
        phoneNumberId: {
            type: String,
        },
        displayName: String,
        linkedAgentId: {
            type: String,
            index: true,
        },
        webhookUrl: String,
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        lastInteractionAt: Date,
        settings: (Schema as unknown as { Types?: { Mixed?: unknown } }).Types?.Mixed || Object,
        metaConfig: {
            appId: {
                type: String,
            },
            appSecret: {
                type: String,
            },
            businessId: {
                type: String,
            },
            accessToken: {
                type: String,
            },
            graphApiVersion: {
                type: String,
            },
        },
    },
    {
        timestamps: true,
    },
);

const ensureIndex = (
    schema: Schema<IWhatsAppNumber>,
    fields: Record<string, 1 | -1>,
    options?: SchemaIndexOptions,
) => {
    const normalizedFields = JSON.stringify(Object.entries(fields).sort(([a], [b]) => a.localeCompare(b)));
    /* istanbul ignore next */
    const normalizedOptions = JSON.stringify(options ?? {});

    const declaredIndexes = getDeclaredIndexes(schema);

    const hasMatch = declaredIndexes.some(([existingFields, existingOptions]) => {
        const existingFieldsString = JSON.stringify(Object.entries(existingFields).sort(([a], [b]) => a.localeCompare(b)));
        /* istanbul ignore next */
        const existingOptionsString = JSON.stringify(existingOptions ?? {});
        return existingFieldsString === normalizedFields && existingOptionsString === normalizedOptions;
    });

    if (!hasMatch) {
        schema.index(fields, options);
        /* istanbul ignore next */
        if (typeof (schema as any).indexes !== 'function') {
            declaredIndexes.push([fields, options]);
        }
    }
};

ensureIndex(WhatsAppNumberSchema, { phoneNumber: 1 }, { unique: true });
ensureIndex(WhatsAppNumberSchema, { phoneNumberId: 1 }, { sparse: true });
ensureIndex(WhatsAppNumberSchema, { userId: 1, status: 1 });

/* istanbul ignore next */
const WhatsAppNumberModel =
    (models?.WhatsAppNumber as Model<IWhatsAppNumber> | undefined) ||
    model<IWhatsAppNumber>('WhatsAppNumber', WhatsAppNumberSchema);

export default WhatsAppNumberModel;
