import * as Yup from 'yup';
import User from '../models/User';

class UserController {
  // Cadastra um único registro
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
    });

    if (!(await schema.isValid(req.body))) {
      return res.json({ error: 'Validation is fails' });
    }

    const userExists = await User.findOne({
      where: { email: req.body.email },
    });

    if (userExists) {
      return res.status(400).json({
        error: 'User already exist',
      });
    }

    const { id, name, email, password, provider } = await User.create(req.body);

    return res.json({ id, name, email, password, provider });
  }

  async update(req, res) {
    // Consistência dos inputs
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.json({ error: 'Validation is fails' });
    }

    const { email, oldPassword } = req.body;
    const user = await User.findByPk(req.userId);

    // Se o novo e-mail é diferente do atual
    if (email !== user.email) {
      const userExists = await User.findOne({
        where: { email },
      });

      if (userExists) {
        return res.status(400).json({
          error: 'E-mail already used',
        });
      }
    }
    // Senha não confere
    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({
        error: 'Password does not match',
      });
    }

    const { id, name, provider } = await user.update(req.body);

    return res.json({
      id,
      name,
      email,
      provider,
    });
  }
}

export default new UserController();