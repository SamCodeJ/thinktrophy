const { z } = require('zod');

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  email:    z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain a number'),
  first_name: z.string().min(1, 'First name is required'),
  last_name:  z.string().min(1, 'Last name is required'),
  phone_number: z.string().min(5, 'Phone number is required'),
  referral_code: z.string().max(20).optional(),
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
  password: z.string().min(1),
  email: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  identifier: z.string().min(1).optional(),
}).refine(
  d => !!(String(d.identifier || d.email || d.username || '').trim()),
  { message: 'Username or email is required', path: ['email'] }
);

const adminLoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const createSessionSchema = z.object({
  category_ids: z.array(z.string().uuid()).length(7, 'Exactly 7 categories required'),
  stake_amount: z.number().positive(),
});

const submitAnswerSchema = z.object({
  answer_uuid: z.string().uuid('Answer must be an opaque UUID'),
  session_token: z.string().min(10),
});

const depositSchema = z.object({
  amount:    z.number().min(1).max(1000000),
  reference: z.string().optional(),
});

const withdrawSchema = z.object({
  amount: z.coerce.number().finite().positive(),
  account_details: z.object({
    type:           z.enum(['bank', 'mobile_money']),
    account_number: z.string().min(10).max(10),
    account_name:   z.string().min(2),
    bank_code:      z.string().min(3, 'Bank code is required'),
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

const updateQuestionSchema = z.object({
  category_id:    z.string().uuid().optional(),
  question_text:  z.string().min(10).optional(),
  option_a:       z.string().min(1).optional(),
  option_b:       z.string().min(1).optional(),
  option_c:       z.string().min(1).optional(),
  option_d:       z.string().min(1).optional(),
  correct_option: z.enum(['a','b','c','d']).optional(),
  difficulty:     z.enum(['easy','medium','hard']).optional(),
  is_active:      z.boolean().optional(),
}).refine(
  (data) => Object.values(data).some(v => v !== undefined),
  { message: 'At least one field is required' }
);

const createCategorySchema = z.object({
  name:        z.string().min(2).max(100),
  description: z.string().optional(),
  icon_name:   z.string().optional(),
});

const testimonialBodySchema = z.object({
  author_name:   z.string().min(1).max(120),
  author_title:  z.union([z.string().max(200), z.literal(''), z.null()]).optional(),
  quote:         z.string().min(3).max(4000),
  rating:        z.union([z.number().int().min(1).max(5), z.null()]).optional(),
  sort_order:    z.number().int().min(0).max(99999).optional(),
  is_active:     z.boolean().optional(),
}).transform((d) => ({
  ...d,
  author_title: d.author_title === '' || d.author_title === undefined ? null : d.author_title,
}));

const settingsSchema = z.object({
  min_stake:        z.number().min(0.01).optional(),
  max_stake:        z.number().positive().optional(),
  payout_perfect:   z.number().min(0).optional(),
  payout_nine:      z.number().min(0).optional(),
  game_duration:    z.number().int().min(10).optional(),
  platform_name:    z.string().optional(),
  platform_tagline: z.string().optional(),
  kiosk_mode:       z.boolean().optional(),
  kiosk_warning_count: z.number().int().min(1).optional(),
  referral_win_percentage: z.number().min(0).max(1).optional(),
  user_win_tax_percentage: z.number().min(0).max(1).optional(),
  min_withdrawal:   z.number().positive().optional(),
  max_withdrawal:   z.number().positive().optional(),
}).superRefine((data, ctx) => {
  if (data.min_withdrawal != null && data.max_withdrawal != null && data.min_withdrawal > data.max_withdrawal) {
    ctx.addIssue({
      code: 'custom',
      message: 'Minimum withdrawal cannot be greater than the maximum withdrawal',
      path: ['min_withdrawal'],
    });
  }
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().min(1, 'Reset code is required'),
  new_password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain a number'),
});

const updatePasswordSchema = z.object({
  old_password: z.string().min(1, 'Old password is required'),
  new_password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain a number'),
});

const resolveAccountSchema = z.object({
  account_number: z.string().min(10).max(10),
  bank_code: z.string().min(3),
});

const correctGameAnswerSchema = z.object({
  question_id: z.string().uuid(),
  is_correct:  z.boolean(),
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
  resolveAccountSchema,
  createQuestionSchema,
  updateQuestionSchema,
  createCategorySchema,
  testimonialBodySchema,
  settingsSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  correctGameAnswerSchema,
};
