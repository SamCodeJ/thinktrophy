const { z } = require('zod');

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  email:    z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain a number'),
  first_name: z.string().min(1, 'First name is required'),
  last_name:  z.string().min(1, 'Last name is required'),
  phone_number: z.string().min(5, 'Phone number is required'),
  dob: z.string().refine(dateStr => {
    const dobDate = new Date(dateStr);
    if (isNaN(dobDate.getTime())) return false;
    
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
    return age >= 18;
  }, { message: 'You must be at least 18 years old to register' }),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const adminLoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const createSessionSchema = z.object({
  category_ids: z.array(z.string().uuid()).length(5, 'Exactly 5 categories required'),
  stake_amount: z.number().positive(),
});

const submitAnswerSchema = z.object({
  answer_uuid: z.string().uuid('Answer must be an opaque UUID'),
  session_token: z.string().min(10),
});

const depositSchema = z.object({
  amount:    z.number().min(1),
  reference: z.string().optional(),
});

const withdrawSchema = z.object({
  amount:          z.number().positive(),
  account_details: z.object({
    type:          z.enum(['bank', 'mobile_money']),
    account_number: z.string().min(5),
    account_name:   z.string().min(2),
    bank_code:      z.string().optional(),
  }),
});

const createQuestionSchema = z.object({
  category_id:    z.string().uuid(),
  question_text:  z.string().min(10),
  option_a:       z.string().min(1),
  option_b:       z.string().min(1),
  option_c:       z.string().min(1),
  option_d:       z.string().min(1),
  correct_option: z.enum(['a','b','c','d']),
  difficulty:     z.enum(['easy','medium','hard']),
});

const createCategorySchema = z.object({
  name:        z.string().min(2).max(100),
  description: z.string().optional(),
  icon_name:   z.string().optional(),
});

const settingsSchema = z.object({
  min_stake:        z.number().min(0.01).optional(),
  max_stake:        z.number().positive().optional(),
  payout_perfect:   z.number().min(1).optional(),
  payout_nine:      z.number().min(1).optional(),
  platform_name:    z.string().optional(),
  platform_tagline: z.string().optional(),
  kiosk_mode:       z.boolean().optional(),
  kiosk_warning_count: z.number().int().min(1).optional(),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: errors.join('; ') },
      });
    }
    req.body = result.data;
    next();
  };
}

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  adminLoginSchema,
  createSessionSchema,
  submitAnswerSchema,
  depositSchema,
  withdrawSchema,
  createQuestionSchema,
  createCategorySchema,
  settingsSchema,
};
