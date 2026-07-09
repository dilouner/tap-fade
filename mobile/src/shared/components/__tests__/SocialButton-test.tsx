import { fireEvent, render } from '@testing-library/react-native';

import { SocialButton } from '../SocialButton';

describe('SocialButton', () => {
  it('handles presses', async () => {
    const onPress = jest.fn();

    const { getByText } = await render(<SocialButton icon="G" label="Google" onPress={onPress} />);

    fireEvent.press(getByText('Google'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading label and blocks presses', async () => {
    const onPress = jest.fn();

    const { getByText } = await render(<SocialButton icon="G" label="Google" loading onPress={onPress} />);

    fireEvent.press(getByText('Conectando...'));

    expect(getByText('Conectando...')).toBeTruthy();
    expect(onPress).not.toHaveBeenCalled();
  });
});
