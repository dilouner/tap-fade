import { fireEvent, render } from '@testing-library/react-native';

import { PrimaryButton } from '../PrimaryButton';

describe('PrimaryButton', () => {
  it('renders the provided label and handles presses', async () => {
    const onPress = jest.fn();

    const { getByText } = await render(<PrimaryButton label="Entrar" onPress={onPress} />);

    fireEvent.press(getByText('Entrar'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not handle presses while disabled', async () => {
    const onPress = jest.fn();

    const { getByText } = await render(<PrimaryButton disabled label="Entrar" onPress={onPress} />);

    fireEvent.press(getByText('Entrar'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a loading indicator instead of the label while loading', async () => {
    const { getByTestId, queryByText } = await render(<PrimaryButton label="Entrar" loading />);

    expect(queryByText('Entrar')).toBeNull();
    expect(getByTestId('primary-button-loading')).toBeTruthy();
  });
});
