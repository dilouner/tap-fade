import { fireEvent, render } from '@testing-library/react-native';

import { InputField } from '../InputField';

describe('InputField', () => {
  it('renders the placeholder and current value', async () => {
    const { getByDisplayValue, getByPlaceholderText } = await render(
      <InputField icon="@" placeholder="Correo" value="usuario@tapfade.com" />,
    );

    expect(getByPlaceholderText('Correo')).toBeTruthy();
    expect(getByDisplayValue('usuario@tapfade.com')).toBeTruthy();
  });

  it('calls onChangeText when the value changes', async () => {
    const onChangeText = jest.fn();

    const { getByPlaceholderText } = await render(
      <InputField icon="@" onChangeText={onChangeText} placeholder="Correo" />,
    );

    fireEvent.changeText(getByPlaceholderText('Correo'), 'nuevo@tapfade.com');

    expect(onChangeText).toHaveBeenCalledWith('nuevo@tapfade.com');
  });

  it('renders and handles the secure visibility toggle', async () => {
    const onTogglePress = jest.fn();

    const { getByText } = await render(
      <InputField
        icon="*"
        isSecureVisible={false}
        onTogglePress={onTogglePress}
        placeholder="Password"
        showToggle
      />,
    );

    fireEvent.press(getByText('Ver'));

    expect(onTogglePress).toHaveBeenCalledTimes(1);
  });
});
